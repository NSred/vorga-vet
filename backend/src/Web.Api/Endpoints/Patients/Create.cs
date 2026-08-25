using Application.Abstractions.Messaging;
using Application.Patients.Create;
using Domain.Patients;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Patients;

internal sealed class Create : IEndpoint
{
    public sealed class Request
    {
        public Guid OwnerId { get; set; }
        public Guid BreedId { get; set; }
        public string CardNumber { get; set; }
        public string Name { get; set; }
        public int Sex { get; set; }
        public DateTime? BirthDate { get; set; }
        public decimal? WeightKg { get; set; }
        public string? Color { get; set; }
        public string? ChipNumber { get; set; }
        public string? Anamnesis { get; set; }
        public string? Note { get; set; }
        public List<Guid> AllergenIds { get; set; } = [];
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("patients", async (
            Request request,
            ICommandHandler<CreatePatientCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreatePatientCommand
            {
                OwnerId = request.OwnerId,
                BreedId = request.BreedId,
                CardNumber = request.CardNumber,
                Name = request.Name,
                Sex = (Sex)request.Sex,
                BirthDate = request.BirthDate,
                WeightKg = request.WeightKg,
                Color = request.Color,
                ChipNumber = request.ChipNumber,
                Anamnesis = request.Anamnesis,
                Note = request.Note,
                AllergenIds = request.AllergenIds
            };

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Patients)
        .RequireAuthorization();
    }
}
