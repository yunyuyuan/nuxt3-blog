<script setup lang="ts">
import { HeaderTabs } from "~/utils/types";

definePageMeta({
  middleware () {
    return navigateTo(HeaderTabs[0].url);
  }
});
</script>
