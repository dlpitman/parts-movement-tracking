param(
  [Parameter(Mandatory=$true)][string]$TenantId,
  [Parameter(Mandatory=$true)][string]$ClientId,
  [Parameter(Mandatory=$true)][string]$ClientSecret,
  [Parameter(Mandatory=$true)][string]$OrgApiUrl   # e.g. https://contoso.api.crm.dynamics.com
)

function Get-AuthToken {
  param($TenantId, $ClientId, $ClientSecret, $Resource)

  $body = @{ 
    grant_type    = "client_credentials"
    client_id     = $ClientId
    client_secret = $ClientSecret
    resource      = $Resource
  }

  $tokenResponse = Invoke-RestMethod -Method Post -Uri "https://login.microsoftonline.com/$TenantId/oauth2/token" -Body $body
  return $tokenResponse.access_token
}

function Invoke-Dataverse {
  param($Method, $Url, $Token, $Body = $null)
  $headers = @{ Authorization = "Bearer $Token"; "OData-MaxVersion" = "4.0"; "OData-Version" = "4.0"; Accept = "application/json"; "Content-Type" = "application/json; charset=utf-8" }
  if ($Body) {
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -Body ($Body | ConvertTo-Json -Depth 10)
  } else {
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers
  }
}

# Acquire token (resource must match org host)
$resource = $OrgApiUrl.TrimEnd('/') + "/"
$token = Get-AuthToken -TenantId $TenantId -ClientId $ClientId -ClientSecret $ClientSecret -Resource $resource

if (-not $token) { throw "Failed to get token" }

$apiBase = "$OrgApiUrl/api/data/v9.2"

Write-Host "Creating global option set: pm_department..."
# Create global option set (global choices) - displayname/typename are required
$deptOptionSet = @{
  "OptionSetType" = 2  # Picklist
  "Name" = "pm_department"
  "DisplayName" = @{ "LocalizedLabels" = @(@{ "Label" = "Department"; "LanguageCode" = 1033 }) }
  "Description" = @{ "LocalizedLabels" = @(@{ "Label" = "Departments for parts tracking"; "LanguageCode" = 1033 }) }
  "Options" = @(
    @{ "Label" = @{ "LocalizedLabels" = @(@{ "Label" = "OPS"; "LanguageCode" = 1033 }) }; "Value" = 100000001 },
    @{ "Label" = @{ "LocalizedLabels" = @(@{ "Label" = "ENG"; "LanguageCode" = 1033 }) }; "Value" = 100000002 },
    @{ "Label" = @{ "LocalizedLabels" = @(@{ "Label" = "MAINTENANCE"; "LanguageCode" = 1033 }) }; "Value" = 100000003 },
    @{ "Label" = @{ "LocalizedLabels" = @(@{ "Label" = "TSMS"; "LanguageCode" = 1033 }) }; "Value" = 100000004 },
    @{ "Label" = @{ "LocalizedLabels" = @(@{ "Label" = "Other - Enter"; "LanguageCode" = 1033 }) }; "Value" = 100000005 }
  )
}

# Create option set (this uses global OptionSetDefinitions)
$optSetUrl = "$apiBase/OptionSetDefinitions"
try {
  Invoke-Dataverse -Method Post -Url $optSetUrl -Token $token -Body $deptOptionSet | Out-Null
  Write-Host "Created pm_department option set."
} catch {
  Write-Warning "Failed to create option set pm_department. It may already exist or your app lacks privileges. Error: $($_.Exception.Message)"
}

# Create part table (custom entity)
Write-Host "Creating custom table: pm_part..."
$partEntity = @{
  "SchemaName" = "pm_Part"
  "DisplayName" = @{ "LocalizedLabels" = @(@{ "Label" = "Part"; "LanguageCode" = 1033 }) }
  "DisplayCollectionName" = @{ "LocalizedLabels" = @(@{ "Label" = "Parts"; "LanguageCode" = 1033 }) }
  "OwnershipType" = "UserOwned"
  "IsActivity" = $false
  "PrimaryNameAttribute" = "pm_partname"
}

try {
  $entityResp = Invoke-Dataverse -Method Post -Url "$apiBase/EntityDefinitions" -Token $token -Body $partEntity
  Write-Host "Part entity create request sent. Creation is asynchronous; verify in Maker portal."
} catch {
  Write-Warning "Entity create likely failed or exists. Error: $($_.Exception.Message)"
}

# NOTE: Creating attributes (columns) and lookup relationships via the Web API is supported, but payloads are verbose.
# Provide examples for adding the primary name and external id attributes:

Write-Host "Creating attributes on pm_part (pm_partname, pm_externalid)..."
$primaryAttr = @{
  "SchemaName" = "pm_partname"
  "DisplayName" = @{ "LocalizedLabels" = @(@{ "Label" = "Part Name"; "LanguageCode" = 1033 }) }
  "RequiredLevel" = @{ "Value" = "ApplicationRequired" }
  "MaxLength" = 100
  "Format" = "Text"
  "AttributeType" = "String"
}

$externalAttr = @{
  "SchemaName" = "pm_externalid"
  "DisplayName" = @{ "LocalizedLabels" = @(@{ "Label" = "External ID"; "LanguageCode" = 1033 }) }
  "RequiredLevel" = @{ "Value" = "None" }
  "MaxLength" = 100
  "Format" = "Text"
  "AttributeType" = "String"
}

try {
  # Use the entity metadata to find the logical name (if created). For brevity, assuming logical name "pm_part" exists.
  Invoke-Dataverse -Method Post -Url "$apiBase/EntityDefinitions(LogicalName='pm_part')/Attributes" -Token $token -Body $primaryAttr | Out-Null
  Invoke-Dataverse -Method Post -Url "$apiBase/EntityDefinitions(LogicalName='pm_part')/Attributes" -Token $token -Body $externalAttr | Out-Null
  Write-Host "Attribute create requests sent for pm_part."
} catch {
  Write-Warning "Failed to create attributes on pm_part. You may need to create them manually in Maker portal or run this with higher permissions. Error: $($_.Exception.Message)"
}

Write-Host "Script finished. Verify the new tables and option sets in the Power Apps Maker portal."
Write-Host "Recommendation: Use this script as a starting point; many environments prefer defining metadata via Solutions exported from Power Apps, or use Power Platform CLI to import a solution."