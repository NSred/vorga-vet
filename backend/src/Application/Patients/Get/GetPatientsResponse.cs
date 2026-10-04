namespace Application.Patients.Get;

public sealed class GetPatientsResponse
{
    public List<PatientResponse> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
