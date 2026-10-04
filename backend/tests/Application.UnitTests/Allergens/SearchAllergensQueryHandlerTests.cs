using Application.Allergens.Search;
using Application.UnitTests.Abstractions;
using Domain.Allergens;
using SharedKernel;

namespace Application.UnitTests.Allergens;

public sealed class SearchAllergensQueryHandlerTests : BaseHandlerTest
{
    private static void SeedAllergen(TestDbContext context, string name)
    {
        var allergen = Allergen.Create(name);
        context.Allergens.Add(allergen);
    }

    [Fact]
    public async Task Handle_Should_ReturnAllergensOrderedByName_WhenNoSearchTermProvided()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        SeedAllergen(context, "Pollen");
        SeedAllergen(context, "Chicken protein");
        await context.SaveChangesAsync();

        var query = new SearchAllergensQuery(null);
        var handler = new SearchAllergensQueryHandler(context);

        // Act
        Result<List<SearchAllergensResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Select(a => a.Name).ShouldBe(["Chicken protein", "Pollen"]);
    }

    [Fact]
    public async Task Handle_Should_CapResultsAtTwenty_WhenMoreThanTwentyAllergensExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        for (int i = 0; i < 25; i++)
        {
            SeedAllergen(context, $"Allergen {i:D2}");
        }
        await context.SaveChangesAsync();

        var query = new SearchAllergensQuery(null);
        var handler = new SearchAllergensQueryHandler(context);

        // Act
        Result<List<SearchAllergensResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Value.Count.ShouldBe(20);
    }
}

// Note: search-term matching uses EF.Functions.ILike, which throws against the in-memory
// provider — that behavior is covered by the integration tests (AllergensTests) instead.
