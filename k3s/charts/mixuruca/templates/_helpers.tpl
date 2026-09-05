{{- define "mixuruca.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "mixuruca.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "mixuruca.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ include "mixuruca.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "mixuruca.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mixuruca.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
