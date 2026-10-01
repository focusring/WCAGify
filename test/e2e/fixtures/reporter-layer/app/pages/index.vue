<script setup lang="ts">
import type { IssueDocument, ReportDocument } from '@focusring/wcagify-reporter'

const data = useState<{ report: ReportDocument; issues: IssueDocument[] }>('report')
</script>

<template>
  <UMain>
    <UContainer>
      <ReportContent :report="data.report" :issues="data.issues" />
    </UContainer>
  </UMain>
</template>
