using Application.Abstractions.Messaging;

namespace Application.Patients.Delete;

public sealed record DeletePatientCommand(Guid PatientId) : ICommand;
