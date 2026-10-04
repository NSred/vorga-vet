using SharedKernel;

namespace Domain.Examinations;

public static class AttachmentErrors
{
    public static Error NotFound(Guid attachmentId) => Error.NotFound(
        "Attachments.NotFound",
        $"The attachment with the Id = '{attachmentId}' was not found");

    public static readonly Error UnsupportedContentType = Error.Problem(
        "Attachments.UnsupportedContentType",
        "Only JPEG, PNG and WebP images can be attached");

    public static readonly Error EmptyFile = Error.Problem(
        "Attachments.EmptyFile",
        "The uploaded file is empty");

    public static readonly Error FileTooLarge = Error.Problem(
        "Attachments.FileTooLarge",
        "The uploaded file exceeds the 20 MB limit");

    public static readonly Error ContentMissing = Error.NotFound(
        "Attachments.ContentMissing",
        "The attachment record exists but its file is missing from storage");
}
