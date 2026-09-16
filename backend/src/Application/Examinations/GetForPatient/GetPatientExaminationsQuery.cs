using Application.Abstractions.Messaging;

namespace Application.Examinations.GetForPatient;

/// <summary>The clinical timeline for one animal, newest first.</summary>
public sealed record GetPatientExaminationsQuery(Guid PatientId) : IQuery<List<ExaminationResponse>>;
