{{- define "garage-webui.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "garage-webui.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "garage-webui.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" -}}
{{- end -}}

{{- define "garage-webui.labels" -}}
helm.sh/chart: {{ include "garage-webui.chart" . }}
{{ include "garage-webui.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "garage-webui.selectorLabels" -}}
app.kubernetes.io/name: {{ include "garage-webui.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "garage-webui.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "garage-webui.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "garage-webui.configMapName" -}}
{{- if .Values.configMap.name -}}
{{- .Values.configMap.name -}}
{{- else -}}
{{- include "garage-webui.fullname" . -}}
{{- end -}}
{{- end -}}

