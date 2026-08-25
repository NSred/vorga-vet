using Application.Abstractions.Data;
using Domain.Allergens;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Domain.Todos;
using Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Abstractions;

/// <summary>
/// A lightweight in-memory <see cref="DbContext"/> that implements <see cref="IApplicationDbContext"/>
/// so Application handlers can be unit tested without referencing the Infrastructure layer.
/// </summary>
public sealed class TestDbContext(DbContextOptions<TestDbContext> options)
    : DbContext(options), IApplicationDbContext
{
    public DbSet<User> Users { get; set; }

    public DbSet<RefreshToken> RefreshTokens { get; set; }

    public DbSet<TodoItem> TodoItems { get; set; }

    public DbSet<Owner> Owners { get; set; }

    public DbSet<Patient> Patients { get; set; }

    public DbSet<Breed> Breeds { get; set; }

    public DbSet<Allergen> Allergens { get; set; }

    public DbSet<PatientAllergen> PatientAllergens { get; set; }
}
