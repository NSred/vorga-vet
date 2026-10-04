using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Web.Api.Infrastructure;

internal sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        ProblemDetails problemDetails;

        if (exception is BadHttpRequestException badRequest)
        {
            // Minimal API binding failures (a missing required parameter, malformed JSON) throw
            // in Development because ThrowOnBadRequest is on there; in Production they return
            // 400 directly. Map them the same way so the caller sees a client error, not a
            // server fault — and log at Warning, since nothing on our side went wrong.
            logger.LogWarning(exception, "Request rejected as malformed");

            problemDetails = new ProblemDetails
            {
                Status = badRequest.StatusCode,
                Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.1",
                Title = "Bad request",
                Detail = badRequest.Message
            };
        }
        else
        {
            logger.LogError(exception, "Unhandled exception occurred");

            problemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.6.1",
                Title = "Server failure"
            };
        }

        httpContext.Response.StatusCode = problemDetails.Status ?? StatusCodes.Status500InternalServerError;

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}
