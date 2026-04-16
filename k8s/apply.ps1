$ErrorActionPreference = "Stop"

function Invoke-Kubectl {
	param([string[]]$Args)
	& kubectl @Args
	if ($LASTEXITCODE -ne 0) {
		throw "kubectl failed: kubectl $($Args -join ' ')"
	}
}

Invoke-Kubectl @("apply", "-f", ".\namespace.yaml")
Invoke-Kubectl @("apply", "-f", ".\configmap.yaml")
Invoke-Kubectl @("apply", "-f", ".\secret.example.yaml")
Invoke-Kubectl @("apply", "-f", ".\storage.yaml")
Invoke-Kubectl @("apply", "-f", ".\postgres.yaml")
Invoke-Kubectl @("apply", "-f", ".\redis.yaml")

Invoke-Kubectl @("rollout", "status", "deployment/postgres", "-n", "complyt", "--timeout=240s")
Invoke-Kubectl @("rollout", "status", "deployment/redis", "-n", "complyt", "--timeout=240s")

Invoke-Kubectl @("delete", "job", "complyt-migrate", "-n", "complyt", "--ignore-not-found")
Invoke-Kubectl @("apply", "-f", ".\migrate-job.yaml")
Invoke-Kubectl @("wait", "--for=condition=complete", "job/complyt-migrate", "-n", "complyt", "--timeout=240s")

Invoke-Kubectl @("apply", "-f", ".\api.yaml")
Invoke-Kubectl @("apply", "-f", ".\workers.yaml")

Invoke-Kubectl @("rollout", "status", "deployment/complyt-api", "-n", "complyt", "--timeout=240s")
Invoke-Kubectl @("rollout", "status", "deployment/complyt-worker", "-n", "complyt", "--timeout=240s")
