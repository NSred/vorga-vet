using Application.Abstractions.Authentication;
using Application.Appointments.Cancel;
using Application.Appointments.CheckIn;
using Application.Appointments.MarkNoShow;
using Application.Appointments.Reschedule;
using Application.Appointments.Resolution;
using Application.UnitTests.Abstractions;
using Domain.Appointments;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Appointments;

public sealed class AppointmentLifecycleHandlerTests : BaseHandlerTest
{
    private static readonly DateTime Slot = new(2026, 9, 10, 9, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 9, 10, 9, 5, 0, DateTimeKind.Utc);

    private static IUserContext UserContext(Role role, Guid userId)
    {
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.Role.Returns(role);
        userContext.UserId.Returns(userId);

        return userContext;
    }

    private static IDateTimeProvider Clock()
    {
        IDateTimeProvider clock = Substitute.For<IDateTimeProvider>();
        clock.UtcNow.Returns(Now);

        return clock;
    }

    private static Appointment SeedThinBooking(TestDbContext context, Guid createdBy, DateTime? startsAt = null)
    {
        var appointment = Appointment.Create(
            createdBy, null, null, startsAt ?? Slot, 30, AppointmentType.FirstVisit, "new puppy", DateTime.UtcNow);
        context.Appointments.Add(appointment);

        return appointment;
    }

    [Fact]
    public async Task CheckIn_Should_CreateOwnerAndPatientAndAttachThem_WhenBookingHadNeither()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Appointment appointment = SeedThinBooking(context, Guid.NewGuid());
        var breed = Breed.Create("Golden Retriever", Species.Dog);
        context.Breeds.Add(breed);
        await context.SaveChangesAsync();

        var handler = new CheckInAppointmentCommandHandler(context, Clock());
        var command = new CheckInAppointmentCommand(
            appointment.Id,
            new OwnerResolution(null, new NewOwnerDetails("Marko", "Ilić", "064/1", "Adresa 1", "Novi Sad", null)),
            new PatientResolution(null, new NewPatientDetails(breed.Id, "D26-00001", "Luna", Sex.Female, null, null, null, null)));

        // Act
        Result<CheckInAppointmentResponse> result = await handler.Handle(command, CancellationToken.None);

        // Assert — the thin booking became real records, in one go.
        result.IsSuccess.ShouldBeTrue();
        appointment.Status.ShouldBe(AppointmentStatus.CheckedIn);
        appointment.CheckedInAt.ShouldBe(Now);
        appointment.OwnerId.ShouldBe(result.Value.OwnerId);
        appointment.PatientId.ShouldBe(result.Value.PatientId);

        Patient luna = await context.Patients.SingleAsync(p => p.Id == result.Value.PatientId);
        luna.OwnerId.ShouldBe(result.Value.OwnerId);
        luna.Name.ShouldBe("Luna");
        (await context.Owners.CountAsync()).ShouldBe(1);
    }

    [Fact]
    public async Task CheckIn_Should_Fail_WhenBookingHasNoOwnerAndNoneIsProvided()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Appointment appointment = SeedThinBooking(context, Guid.NewGuid());
        await context.SaveChangesAsync();

        var handler = new CheckInAppointmentCommandHandler(context, Clock());

        // Act
        Result<CheckInAppointmentResponse> result =
            await handler.Handle(new CheckInAppointmentCommand(appointment.Id, null, null), CancellationToken.None);

        // Assert — nothing was written, and the status did not move.
        result.Error.ShouldBe(AppointmentErrors.OwnerResolutionRequired);
        appointment.Status.ShouldBe(AppointmentStatus.Scheduled);
        (await context.Owners.CountAsync()).ShouldBe(0);
    }

    [Fact]
    public async Task CheckIn_Should_Fail_WhenAppointmentIsAlreadyClosed()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Appointment appointment = SeedThinBooking(context, Guid.NewGuid());
        appointment.Cancel(Now, Guid.NewGuid(), "changed plans");
        await context.SaveChangesAsync();

        var handler = new CheckInAppointmentCommandHandler(context, Clock());

        // Act
        Result<CheckInAppointmentResponse> result =
            await handler.Handle(new CheckInAppointmentCommand(appointment.Id, null, null), CancellationToken.None);

        // Assert
        result.Error.ShouldBe(AppointmentErrors.InvalidTransition(AppointmentStatus.Cancelled, AppointmentStatus.CheckedIn));
    }

    [Fact]
    public async Task MarkNoShow_Should_CloseAppointmentAndRecordWhoDecided()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Appointment appointment = SeedThinBooking(context, Guid.NewGuid());
        await context.SaveChangesAsync();
        var vet = Guid.NewGuid();

        var handler = new MarkNoShowCommandHandler(context, UserContext(Role.Veterinarian, vet), Clock());

        // Act
        Result result = await handler.Handle(new MarkNoShowCommand(appointment.Id, "no call"), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        appointment.Status.ShouldBe(AppointmentStatus.NoShow);
        appointment.ClosedAt.ShouldBe(Now);
        appointment.ClosedByUserId.ShouldBe(vet);
        appointment.ResolutionNote.ShouldBe("no call");
    }

    [Fact]
    public async Task Cancel_Should_ReturnNotFound_WhenClientCancelsSomeoneElsesBooking()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Appointment appointment = SeedThinBooking(context, createdBy: Guid.NewGuid());
        await context.SaveChangesAsync();

        var handler = new CancelAppointmentCommandHandler(context, UserContext(Role.Client, Guid.NewGuid()), Clock());

        // Act
        Result result = await handler.Handle(new CancelAppointmentCommand(appointment.Id, null), CancellationToken.None);

        // Assert — unprobeable: NotFound, not Forbidden, and nothing changed.
        result.Error.ShouldBe(AppointmentErrors.NotFound(appointment.Id));
        appointment.Status.ShouldBe(AppointmentStatus.Scheduled);
    }

    [Fact]
    public async Task Cancel_Should_Succeed_WhenClientCancelsOwnBooking()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var client = Guid.NewGuid();
        Appointment appointment = SeedThinBooking(context, createdBy: client);
        await context.SaveChangesAsync();

        var handler = new CancelAppointmentCommandHandler(context, UserContext(Role.Client, client), Clock());

        // Act
        Result result = await handler.Handle(new CancelAppointmentCommand(appointment.Id, "can't make it"), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        appointment.Status.ShouldBe(AppointmentStatus.Cancelled);
        appointment.ClosedByUserId.ShouldBe(client);
        appointment.ResolutionNote.ShouldBe("can't make it");
    }

    [Fact]
    public async Task Reschedule_Should_Fail_WhenTargetSlotIsTakenByAnotherActiveBooking()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var vet = Guid.NewGuid();
        Appointment moving = SeedThinBooking(context, vet, Slot);
        SeedThinBooking(context, vet, Slot.AddHours(1));
        await context.SaveChangesAsync();

        var handler = new RescheduleAppointmentCommandHandler(context, UserContext(Role.Veterinarian, vet));

        // Act
        Result result = await handler.Handle(
            new RescheduleAppointmentCommand(moving.Id, Slot.AddHours(1), null), CancellationToken.None);

        // Assert
        result.Error.ShouldBe(AppointmentErrors.SlotTaken);
        moving.StartsAt.ShouldBe(Slot);
    }

    [Fact]
    public async Task Reschedule_Should_MoveStartAndEnd_WhenSlotIsFree()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var vet = Guid.NewGuid();
        Appointment moving = SeedThinBooking(context, vet, Slot);
        await context.SaveChangesAsync();

        var handler = new RescheduleAppointmentCommandHandler(context, UserContext(Role.Veterinarian, vet));
        DateTime target = Slot.AddHours(2);

        // Act
        Result result = await handler.Handle(new RescheduleAppointmentCommand(moving.Id, target, null), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        moving.StartsAt.ShouldBe(target);
        moving.EndsAt.ShouldBe(target.AddMinutes(30));
        moving.DomainEvents.ShouldContain(e => e is AppointmentRescheduledDomainEvent);
    }

    [Fact]
    public async Task Reschedule_Should_Fail_WhenAppointmentIsNoLongerScheduled()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var vet = Guid.NewGuid();
        Appointment appointment = SeedThinBooking(context, vet, Slot);
        appointment.CheckIn(Now);
        await context.SaveChangesAsync();

        var handler = new RescheduleAppointmentCommandHandler(context, UserContext(Role.Veterinarian, vet));

        // Act
        Result result = await handler.Handle(
            new RescheduleAppointmentCommand(appointment.Id, Slot.AddHours(2), null), CancellationToken.None);

        // Assert
        result.Error.ShouldBe(AppointmentErrors.OnlyScheduledCanBeRescheduled);
    }
}
