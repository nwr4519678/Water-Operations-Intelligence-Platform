using WaterOperations.Domain.Common.Results;

namespace WaterOperations.Domain.Entities;

public partial class User
{
    public Result SetMfaSecret(byte[] encryptedSecret)
    {
        if (encryptedSecret.Length == 0)
        {
            return Result.Failure("mfa_secret_required");
        }

        MfaSecretEncrypted = encryptedSecret;
        IsMfaEnabled = false;
        return Result.Success();
    }

    public Result EnableMfa()
    {
        if (MfaSecretEncrypted is null || MfaSecretEncrypted.Length == 0)
        {
            return Result.Failure("mfa_enrollment_required");
        }

        IsMfaEnabled = true;
        return Result.Success();
    }
}
