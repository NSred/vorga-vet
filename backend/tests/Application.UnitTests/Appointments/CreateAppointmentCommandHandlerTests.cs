using Application.Abstractions.Authentication;
using Application.Appointments.Create;
using Application.UnitTests.Abstractions;
using Domain.Appointments;
using Domain.Owners;
using Domain.Patients;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Appointments;

public sealed class CreateAppointmentCommandHandlerTests : BaseHandlerTest
{
    private static readonly DateTime Slot = new(2026, 9, 10, 9, 0, 0, DateTimeKind.Utc);

    private static CreateAppointmentCommandHandler CreateHandler(
        TestDbContext context, Role role, Guid userId)
    {
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.Role.Returns(role);
        userContext.UserId.Returns(userId);

        IDateTimeProvider clock = Substitute.For<IDateTimeProvider>();
        clock.UtcNow.Returns(new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc));

        return new CreateAppointmentCommandHandler(context, userContext, clock);
    }

    [Fact]
    public async Task Handle_Should_CreateScheduledAppointment_WhenVetBooksValidSlot()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        CreateAppointmentCommandHandler handler = CreateHandler(context, Role.Veterinarian, Guid.NewGuid());

        var command = new CreateAppointmentCommand(null, null, Slot, 30, AppointmentType.Checkup, "Routine");

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        Appointment appointment = await context.Appointments.SingleAsync(a => a.Id == result.Value);
        appointment.Status.ShouldBe(AppointmentStatus.Scheduled);
        appointment.EndsAt.ShouldBe(Slot.AddMinutes(30));
        appointment.DomainEvents.ShouldContain(e => e is AppointmentScheduledDomainEvent);
    }

    [Fact]
    public async Task Handle_Should_Fail_WhenClientRequestsSurgery()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        CreateAppointmentCommandHandler handler = CreateHandler(context, Role.Client, Guid.NewGuid());

        var command = new CreateAppointmentCommand(null, null, Slot, 60, AppointmentType.Surgery, null);

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Error.ShouldBe(AppointmentErrors.SurgeryRequiresVeterinarian);
    }

    [Fact]
    public async Task Handle_Should_Fail_WhenNonSurgeryLongerThan30Minutes()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        CreateAppointmentCommandHandler handler = CreateHandler(context, Role.Veterinarian, Guid.NewGuid());

        var command = new CreateAppointmentCommand(null, null, Slot, 60, AppointmentType.Checkup, null);

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Error.ShouldBe(AppointmentErrors.InvalidDuration);
    }

    [Fact]
    public async Task Handle_Should_Fail_WhenSlotOverlapsAnActiveAppointment()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var existing = Appointment.Create(
            Guid.NewGuid(), null, null, Slot, 30, AppointmentType.Checkup, null, DateTime.UtcNow);
        context.Appointments.Add(existing);
        await context.SaveChangesAsync();

        CreateAppointmentCommandHandler handler = CreateHandler(context, Role.Veterinarian, Guid.NewGuid());
        var command = new CreateAppointmentCommand(null, null, Slot, 30, AppointmentType.BloodDraw, null);

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Error.ShouldBe(AppointmentErrors.SlotTaken);
    }

    [Fact]
    public async Task Handle_Should_AttachLinkedOwner_WhenClientBooksForSelf()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var userId = Guid.NewGuid();

        var owner = Owner.Create("Marko", "Ilić", "064/1", "Adresa 1", "Novi Sad");
        owner.LinkToUser(userId);
        context.Owners.Add(owner);
        await context.SaveChangesAsync();

        CreateAppointmentCommandHandler handler = CreateHandler(context, Role.Client, userId);
        var command = new CreateAppointmentCommand(null, null, Slot, 30, AppointmentType.FirstVisit, null);

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        Appointment appointment = await context.Appointments.SingleAsync(a => a.Id == result.Value);
        appointment.OwnerId.ShouldBe(owner.Id);
    }

    [Fact]
    public async Task Handle_Should_Fail_WhenClientBooksForPatientTheyDoNotOwn()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var userId = Guid.NewGuid();

        var clientOwner = Owner.Create("Marko", "Ilić", "064/1", "Adresa 1", "Novi Sad");
        clientOwner.LinkToUser(userId);
        var otherOwner = Owner.Create("Ana", "Petrović", "064/2", "Adresa 2", "Beograd");
        context.Owners.AddRange(clientOwner, otherOwner);

        var otherPatient = Patient.Create(
            otherOwner.Id, Guid.NewGuid(), "C001", "Luna", Sex.Female,
            null, null, null, null, null, null, DateTime.UtcNow);
        context.Patients.Add(otherPatient);
        await context.SaveChangesAsync();

        CreateAppointmentCommandHandler handler = CreateHandler(context, Role.Client, userId);
        var command = new CreateAppointmentCommand(null, otherPatient.Id, Slot, 30, AppointmentType.Checkup, null);

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Error.ShouldBe(AppointmentErrors.PatientDoesNotBelongToOwner);
    }
}
