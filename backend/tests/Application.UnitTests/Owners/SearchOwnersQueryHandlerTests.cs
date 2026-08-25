using Application.Owners.Search;
using Application.UnitTests.Abstractions;
using Domain.Owners;
using SharedKernel;

namespace Application.UnitTests.Owners;

public sealed class SearchOwnersQueryHandlerTests : BaseHandlerTest
{
    private static void SeedOwner(TestDbContext context, string firstName, string lastName)
    {
        var owner = Owner.Create(firstName, lastName, "064/1234567", "Zmaj Jovina 4", "Novi Sad");
        context.Owners.Add(owner);
    }

    [Fact]
    public async Task Handle_Should_ReturnOwnersOrderedByName_WhenNoSearchTermProvided()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        SeedOwner(context, "Milan", "Subić");
        SeedOwner(context, "Ana", "Petrović");
        await context.SaveChangesAsync();

        var query = new SearchOwnersQuery(null);
        var handler = new SearchOwnersQueryHandler(context);

        // Act
        Result<List<SearchOwnersResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Select(o => o.LastName).ShouldBe(["Petrović", "Subić"]);
    }

    [Fact]
    public async Task Handle_Should_CapResultsAtTwenty_WhenMoreThanTwentyOwnersExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        for (int i = 0; i < 25; i++)
        {
            SeedOwner(context, "Test", $"Owner{i:D2}");
        }
        await context.SaveChangesAsync();

        var query = new SearchOwnersQuery(null);
        var handler = new SearchOwnersQueryHandler(context);

        // Act
        Result<List<SearchOwnersResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Value.Count.ShouldBe(20);
    }
}

// Note: search-term matching uses EF.Functions.ILike, which throws against the in-memory
// provider (confirmed: "switched to client-evaluation") — that behavior is covered by the
// integration tests (OwnersTests) against a real Postgres instance instead.
