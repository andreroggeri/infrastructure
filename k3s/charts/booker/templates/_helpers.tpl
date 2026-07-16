{{- define "booker.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "booker.fullname" -}}
{{- default .Chart.Name .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "booker.labels" -}}
app.kubernetes.io/name: {{ include "booker.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}

{{/*
Reusable pod spec for a booker run. Pass a dict with "ctx" (root) and "mode".
Mounts the script from the ConfigMap and pip-installs deps at start.
*/}}
{{- define "booker.podspec" -}}
{{- $ctx := .ctx -}}
restartPolicy: Never
containers:
  - name: booker
    image: "{{ $ctx.Values.image.repository }}:{{ $ctx.Values.image.tag }}"
    imagePullPolicy: {{ $ctx.Values.image.pullPolicy }}
    command: ["/bin/sh", "-c"]
    args:
      - "pip install --no-cache-dir --quiet requests apprise tzdata && exec python /app/reservar.py"
    env:
      - name: MODE
        value: {{ .mode | quote }}
      {{- range $k, $v := .extraEnv }}
      - name: {{ $k }}
        value: {{ $v | quote }}
      {{- end }}
    envFrom:
      - configMapRef:
          name: {{ include "booker.fullname" $ctx }}-config
      - secretRef:
          name: {{ $ctx.Values.existingSecret }}
    volumeMounts:
      - name: script
        mountPath: /app
    resources:
      {{- toYaml $ctx.Values.resources | nindent 6 }}
volumes:
  - name: script
    configMap:
      name: {{ include "booker.fullname" $ctx }}-script
{{- end -}}
