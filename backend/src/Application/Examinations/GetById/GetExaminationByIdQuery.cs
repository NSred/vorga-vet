using Application.Abstractions.Messaging;

namespace Application.Examinations.GetById;

public sealed record GetExaminationByIdQuery(Guid ExaminationId) : IQuery<ExaminationResponse>;
