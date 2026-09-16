using FluentValidation;

namespace Application.Examinations;

/// <summary>
/// The clinical payload of an examination — what the vet types in. Shared by completing an
/// appointment, recording a walk-in, and editing afterwards, so its rules exist once.
/// </summary>
public sealed record ExaminationDetails(
    string PerformedByFirstName,
    string PerformedByLastName,
    string? Anamnesis,
    string? Diagnosis,
    string? Therapy,
    decimal? Cost);

internal sealed class ExaminationDetailsValidator : AbstractValidator<ExaminationDetails>
{
    public ExaminationDetailsValidator()
    {
        RuleFor(d => d.PerformedByFirstName).NotEmpty().MaximumLength(100);
        RuleFor(d => d.PerformedByLastName).NotEmpty().MaximumLength(100);
        RuleFor(d => d.Anamnesis).MaximumLength(4000);
        RuleFor(d => d.Diagnosis).MaximumLength(4000);
        RuleFor(d => d.Therapy).MaximumLength(4000);
        RuleFor(d => d.Cost).GreaterThanOrEqualTo(0).When(d => d.Cost.HasValue);
    }
}
