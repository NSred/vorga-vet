using Application.Abstractions.Messaging;

namespace Application.Examinations.Create;

/// <summary>A walk-in: an examination recorded directly, with no appointment behind it.</summary>
public sealed record CreateExaminationCommand(Guid PatientId, ExaminationDetails Examination) : ICommand<Guid>;
