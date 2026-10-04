using Application.Abstractions.Messaging;

namespace Application.Examinations.Pay;

/// <summary>A dedicated action so "mark paid" is one click and auditable, rather than a general edit.</summary>
public sealed record PayExaminationCommand(Guid ExaminationId) : ICommand;
