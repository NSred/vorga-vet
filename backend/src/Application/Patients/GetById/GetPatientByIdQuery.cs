using Application.Abstractions.Messaging;

namespace Application.Patients.GetById;

public sealed record GetPatientByIdQuery(Guid PatientId) : IQuery<PatientDetailResponse>;
