using Application.Abstractions.Messaging;

namespace Application.Appointments.GetAvailability;

/// <summary>
/// Free / taken occupancy for every clinic slot in a window. Returns no appointment data at
/// all — this is the projection a client is allowed to see. <paramref name="DurationMinutes"/>
/// lets a vet ask "where does a 90-minute surgery fit"; clients are always 30.
/// </summary>
public sealed record GetAvailabilityQuery(DateTime From, DateTime To, int? DurationMinutes)
    : IQuery<List<AvailabilitySlotResponse>>;
