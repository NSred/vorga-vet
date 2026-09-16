using Application.Abstractions.Storage;
using Application.Examinations.Attachments;
using Application.UnitTests.Abstractions;
using Domain.Breeds;
using Domain.Examinations;
using Domain.Owners;
using Domain.Patients;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Examinations;

public sealed class AttachmentHandlerTests : BaseHandlerTest
{
    private static readonly DateTime Now = new(2026, 9, 10, 10, 0, 0, DateTimeKind.Utc);

    private static IDateTimeProvider Clock()
    {
        IDateTimeProvider clock = Substitute.For<IDateTimeProvider>();
        clock.UtcNow.Returns(Now);

        return clock;
    }

    private static async Task<Examination> SeedExaminationAsync(TestDbContext context)
    {
        var owner = Owner.Create("Marko", "Ilić", "064/1", "Adresa 1", "Novi Sad");
        var breed = Breed.Create("Golden Retriever", Species.Dog);
        context.Owners.Add(owner);
        context.Breeds.Add(breed);

        var patient = Patient.Create(
            owner.Id, breed.Id, "D26-00001", "Luna", Sex.Female, null, null, null, null, null, null, Now);
        context.Patients.Add(patient);

        var examination = Examination.Create(patient.Id, null, "J", "J", Now, Now, null, null, null, null, Now);
        context.Examinations.Add(examination);
        await context.SaveChangesAsync();

        return examination;
    }

    [Fact]
    public async Task Upload_Should_StoreBytesAndRecordAttachment_ForAnImage()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Examination examination = await SeedExaminationAsync(context);

        IImageStorage storage = Substitute.For<IImageStorage>();
        storage.SaveAsync(Arg.Any<Stream>(), "image/png", Arg.Any<CancellationToken>()).Returns("2026/09/abc.png");

        var handler = new UploadAttachmentCommandHandler(context, storage, Clock());
        using var content = new MemoryStream([1, 2, 3, 4]);
        var command = new UploadAttachmentCommand(examination.Id, AttachmentKind.Xray, "thorax.png", "image/png", 4, content);

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        Attachment attachment = await context.Attachments.SingleAsync(a => a.Id == result.Value);
        attachment.ExaminationId.ShouldBe(examination.Id);
        attachment.PatientId.ShouldBe(examination.PatientId);
        attachment.StorageKey.ShouldBe("2026/09/abc.png");
        attachment.Kind.ShouldBe(AttachmentKind.Xray);
        attachment.SizeBytes.ShouldBe(4);
    }

    [Fact]
    public async Task Upload_Should_RejectNonImages_WithoutTouchingStorage()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Examination examination = await SeedExaminationAsync(context);
        IImageStorage storage = Substitute.For<IImageStorage>();
        var handler = new UploadAttachmentCommandHandler(context, storage, Clock());
        using var content = new MemoryStream([1]);

        // Act
        Result<Guid> result = await handler.Handle(
            new UploadAttachmentCommand(examination.Id, AttachmentKind.Xray, "notes.txt", "text/plain", 1, content),
            CancellationToken.None);

        // Assert
        result.Error.ShouldBe(AttachmentErrors.UnsupportedContentType);
        await storage.DidNotReceiveWithAnyArgs().SaveAsync(default!, default!, default);
    }

    [Fact]
    public async Task Delete_Should_RemoveRowThenBytes()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Examination examination = await SeedExaminationAsync(context);
        var attachment = Attachment.Create(
            examination.Id, examination.PatientId, AttachmentKind.Ultrasound, "us.png", "image/png", 10, "2026/09/us.png", Now);
        context.Attachments.Add(attachment);
        await context.SaveChangesAsync();

        IImageStorage storage = Substitute.For<IImageStorage>();
        var handler = new DeleteAttachmentCommandHandler(context, storage);

        // Act
        Result result = await handler.Handle(new DeleteAttachmentCommand(examination.Id, attachment.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        (await context.Attachments.AnyAsync()).ShouldBeFalse();
        await storage.Received(1).DeleteAsync("2026/09/us.png", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_Should_ReturnNotFound_WhenAttachmentBelongsToAnotherExamination()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Examination examination = await SeedExaminationAsync(context);
        var attachment = Attachment.Create(
            examination.Id, examination.PatientId, AttachmentKind.Xray, "x.png", "image/png", 10, "k", Now);
        context.Attachments.Add(attachment);
        await context.SaveChangesAsync();

        IImageStorage storage = Substitute.For<IImageStorage>();
        var handler = new DeleteAttachmentCommandHandler(context, storage);

        // Act
        Result result = await handler.Handle(new DeleteAttachmentCommand(Guid.NewGuid(), attachment.Id), CancellationToken.None);

        // Assert
        result.Error.ShouldBe(AttachmentErrors.NotFound(attachment.Id));
        await storage.DidNotReceiveWithAnyArgs().DeleteAsync(default!, default);
    }
}
