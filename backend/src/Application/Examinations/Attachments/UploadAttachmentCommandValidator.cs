using FluentValidation;

namespace Application.Examinations.Attachments;

internal sealed class UploadAttachmentCommandValidator : AbstractValidator<UploadAttachmentCommand>
{
    public UploadAttachmentCommandValidator()
    {
        RuleFor(c => c.ExaminationId).NotEmpty();
        RuleFor(c => c.Kind).IsInEnum();
        RuleFor(c => c.FileName).NotEmpty().MaximumLength(260);
        RuleFor(c => c.ContentType).NotEmpty().MaximumLength(100);
        RuleFor(c => c.Content).NotNull();
    }
}
