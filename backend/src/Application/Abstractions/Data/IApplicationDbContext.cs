using Domain.Allergens;
using Domain.Appointments;
using Domain.Breeds;
using Domain.Clinic;
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
    DbSet<ClinicSchedule> ClinicSchedules { get; }
    DbSet<Appointment> Appointments { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
