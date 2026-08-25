using Application.Breeds.Search;
using Application.UnitTests.Abstractions;
using Domain.Breeds;
using SharedKernel;

namespace Application.UnitTests.Breeds;

public sealed class SearchBreedsQueryHandlerTests : BaseHandlerTest
{
    private static void SeedBreed(TestDbContext context, string name, Species species)
    {
        var breed = Breed.Create(name, species);
        context.Breeds.Add(breed);
    }

    [Fact]
    public async Task Handle_Should_ReturnBreedsForSpeciesOrderedByName_WhenNoSearchTermProvided()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        SeedBreed(context, "Nemački ovčar", Species.Dog);
        SeedBreed(context, "Bišon", Species.Dog);
        await context.SaveChangesAsync();

        var query = new SearchBreedsQuery(Species.Dog, null);
        var handler = new SearchBreedsQueryHandler(context);

        // Act
        Result<List<SearchBreedsResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Select(b => b.Name).ShouldBe(["Bišon", "Nemački ovčar"]);
    }

    [Fact]
    public async Task Handle_Should_ExcludeBreedsFromOtherSpecies()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        SeedBreed(context, "Labrador", Species.Dog);
        SeedBreed(context, "Domaća mačka", Species.Cat);
        await context.SaveChangesAsync();

        var query = new SearchBreedsQuery(Species.Cat, null);
        var handler = new SearchBreedsQueryHandler(context);

        // Act
        Result<List<SearchBreedsResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Value.ShouldHaveSingleItem();
        result.Value[0].Name.ShouldBe("Domaća mačka");
    }

    [Fact]
    public async Task Handle_Should_CapResultsAtTwenty_WhenMoreThanTwentyBreedsExistForSpecies()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        for (int i = 0; i < 25; i++)
        {
            SeedBreed(context, $"Breed {i:D2}", Species.Dog);
        }
        await context.SaveChangesAsync();

        var query = new SearchBreedsQuery(Species.Dog, null);
        var handler = new SearchBreedsQueryHandler(context);

        // Act
        Result<List<SearchBreedsResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Value.Count.ShouldBe(20);
    }
}

// Note: search-term matching uses EF.Functions.ILike, which throws against the in-memory
// provider — that behavior is covered by the integration tests (BreedsTests) instead.
