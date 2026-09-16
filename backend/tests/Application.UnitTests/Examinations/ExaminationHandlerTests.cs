using Application.Abstractions.Authentication;
using Application.Appointments.Complete;
using Application.Appointments.Resolution;
using Application.Examinations;
using Application.Examinations.Create;
using Application.Examinations.Pay;
using Application.UnitTests.Abstractions;
using Domain.Appointments;
using Domain.Breeds;
using Domain.Examinations;
using Domain.Owners;
using Domain.Patients;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Examinations;

public sealed class ExaminationHandlerTests : BaseHandlerTest
{
    private static readonly DateTime Slot = new(2026, 9, 10, 9, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 9, 10, 9, 40, 0, DateTimeKind.Utc);
    private static readonly Guid Vet = Guid.NewGuid();

    private static readonly ExaminationDetails Details =
        new("Jelena", "Jovanović", "Vomiting since yesterday", "Gastritis", "Diet + omeprazole", 3500m);

    private static IUserContext VetContext()
    {
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.Role.Returns(Role.Veterinarian);
        userContext.UserId.Returns(Vet);

        return userContext;
    }

    private static IDateTimeProvider Clock()
    {
        IDateTimeProvider clock = Substitute.For<IDateTimeProvider>();
        clock.UtcNow.Returns(Now);

        return clock;
    }

    private static (Owner Owner, Patient Patient) SeedOwnerAndPatient(TestDbContext context)
    {
        var owner = Owner.Create("Marko", "Ilić", "064/1", "Adresa 1", "Novi Sad");
        var breed = Breed.Create("Golden Retriever", Species.Dog);
        context.Owners.Add(owner);
        context.Breeds.Add(breed);

        var patient = Patient.Create(
            owner.Id, breed.Id, "D26-00001", "Luna", Sex.Female, null, null, null, null, null, null, DateTime.UtcNow);
        context.Patients.Add(patient);

        return (owner, patient);
    }

    [Fact]
    public async Task Complete_Should_RecordExaminationAndCloseAppointment_InOneGo()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        (Owner owner, Patient patient) = SeedOwnerAndPatient(context);
        var appointment = Appointment.Create(Vet, owner.Id, patient.Id, Slot, 30, AppointmentType.Checkup, null, DateTime.UtcNow);
        appointment.CheckIn(Slot.AddMinutes(5));
        context.Appointments.Add(appointment);
        await context.SaveChangesAsync();

        var handler = new CompleteAppointmentCommandHandler(context, VetContext(), Clock());

        // Act
        Result<Guid> result = await handler.Handle(
            new CompleteAppointmentCommand(appointment.Id, null, null, Details), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        Examination examination = await context.Examinations.SingleAsync(e => e.Id == result.Value);
        examination.AppointmentId.ShouldBe(appointment.Id);
        examination.PatientId.ShouldBe(patient.Id);
        examination.StartedAt.ShouldBe(Slot.AddMinutes(5)); // the check-in time, not the booked time
        examination.EndedAt.ShouldBe(Now);
        examination.Cost.ShouldBe(3500m);
        examination.IsPaid.ShouldBeFalse();
        examination.PerformedByLastName.ShouldBe("Jovanović");

        appointment.Status.ShouldBe(AppointmentStatus.Completed);
        appointment.ClosedByUserId.ShouldBe(Vet);
    }

    [Fact]
    public async Task Complete_Should_ResolveOwnerAndPatient_WhenCheckInWasSkipped()
    {
        // Arrange — a thin self-booking completed straight from Scheduled.
        await using TestDbContext context = CreateDbContext();
        var breed = Breed.Create("Chartreux", Species.Cat);
        context.Breeds.Add(breed);
        var appointment = Appointment.Create(Guid.NewGuid(), null, null, Slot, 30, AppointmentType.FirstVisit, null, DateTime.UtcNow);
        context.Appointments.Add(appointment);
        await context.SaveChangesAsync();

        var handler = new CompleteAppointmentCommandHandler(context, VetContext(), Clock());
        var command = new CompleteAppointmentCommand(
            appointment.Id,
            new OwnerResolution(null, new NewOwnerDetails("Ana", "Petrović", "063/2", "Adresa 2", "Beograd", null)),
            new PatientResolution(null, new NewPatientDetails(breed.Id, "C26-00002", "Keti", Sex.Female, null, null, null, null)),
            Details);

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        appointment.PatientId.ShouldNotBeNull();
        Examination examination = await context.Examinations.SingleAsync(e => e.Id == result.Value);
        examination.PatientId.ShouldBe(appointment.PatientId!.Value);
        examination.StartedAt.ShouldBe(Now); // never checked in, so the examination starts now
    }

    [Fact]
    public async Task Complete_Should_Fail_WhenAnExaminationWasAlreadyRecorded()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        (Owner owner, Patient patient) = SeedOwnerAndPatient(context);
        var appointment = Appointment.Create(Vet, owner.Id, patient.Id, Slot, 30, AppointmentType.Checkup, null, DateTime.UtcNow);
        appointment.CheckIn(Slot);
        context.Appointments.Add(appointment);
        context.Examinations.Add(Examination.Create(
            patient.Id, appointment.Id, "J", "J", Slot, Slot, null, null, null, null, DateTime.UtcNow));
        await context.SaveChangesAsync();

        var handler = new CompleteAppointmentCommandHandler(context, VetContext(), Clock());

        // Act
        Result<Guid> result = await handler.Handle(
            new CompleteAppointmentCommand(appointment.Id, null, null, Details), CancellationToken.None);

        // Assert
        result.Error.ShouldBe(ExaminationErrors.AppointmentAlreadyHasExamination);
        appointment.Status.ShouldBe(AppointmentStatus.CheckedIn);
    }

    [Fact]
    public async Task Pay_Should_MarkPaidOnce_AndRejectASecondPayment()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        (_, Patient patient) = SeedOwnerAndPatient(context);
        var examination = Examination.Create(patient.Id, null, "J", "J", Slot, Slot, null, null, null, 1200m, DateTime.UtcNow);
        context.Examinations.Add(examination);
        await context.SaveChangesAsync();

        var handler = new PayExaminationCommandHandler(context, Clock());

        // Act
        Result first = await handler.Handle(new PayExaminationCommand(examination.Id), CancellationToken.None);
        Result second = await handler.Handle(new PayExaminationCommand(examination.Id), CancellationToken.None);

        // Assert
        first.IsSuccess.ShouldBeTrue();
        examination.IsPaid.ShouldBeTrue();
        examination.PaidAt.ShouldBe(Now);
        second.Error.ShouldBe(ExaminationErrors.AlreadyPaid);
    }

    [Fact]
    public async Task CreateExamination_Should_Fail_WhenPatientDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new CreateExaminationCommandHandler(context, Clock());
        var missingPatientId = Guid.NewGuid();

        // Act
        Result<Guid> result = await handler.Handle(
            new CreateExaminationCommand(missingPatientId, Details), CancellationToken.None);

        // Assert
        result.Error.ShouldBe(PatientErrors.NotFound(missingPatientId));
    }

    [Fact]
    public async Task CreateExamination_Should_RecordWalkIn_WithNoAppointment()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        (_, Patient patient) = SeedOwnerAndPatient(context);
        await context.SaveChangesAsync();

        var handler = new CreateExaminationCommandHandler(context, Clock());

        // Act
        Result<Guid> result = await handler.Handle(new CreateExaminationCommand(patient.Id, Details), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        Examination examination = await context.Examinations.SingleAsync(e => e.Id == result.Value);
        examination.AppointmentId.ShouldBeNull();
        examination.PatientId.ShouldBe(patient.Id);
        examination.DomainEvents.ShouldContain(e => e is ExaminationRecordedDomainEvent);
    }
}
