using Application.Abstractions.Messaging;

namespace Application.Examinations.Update;

public sealed record UpdateExaminationCommand(Guid ExaminationId, ExaminationDetails Examination) : ICommand;
