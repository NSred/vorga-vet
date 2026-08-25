using Domain.Allergens;
using Domain.Breeds;
using Domain.Owners;
using Domain.Patients;
using Domain.Todos;
using Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Application.Abstractions.Data;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<TodoItem> TodoItems { get; }
    DbSet<Owner> Owners { get; }
    DbSet<Patient> Patients { get; }
    DbSet<Breed> Breeds { get; }
    DbSet<Allergen> Allergens { get; }
    DbSet<PatientAllergen> PatientAllergens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
