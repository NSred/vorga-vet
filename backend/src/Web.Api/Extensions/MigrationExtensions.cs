using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Application.Abstractions.Clinic;
using SharedKernel;

namespace Web.Api.Extensions;

public static class MigrationExtensions
{
    public static void ApplyMigrations(this IApplicationBuilder app)
    {
        using IServiceScope scope = app.ApplicationServices.CreateScope();

        using ApplicationDbContext dbContext =
            scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        dbContext.Database.Migrate();
    }

    public static async Task SeedDemoDataAsync(this IApplicationBuilder app)
    {
        using IServiceScope scope = app.ApplicationServices.CreateScope();

        ApplicationDbContext dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        IDateTimeProvider dateTimeProvider = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();
        IClinicSettings clinicSettings = scope.ServiceProvider.GetRequiredService<IClinicSettings>();

        await DemoDataSeeder.SeedAsync(dbContext, dateTimeProvider.UtcNow, clinicSettings.TimeZone);
    }
}
