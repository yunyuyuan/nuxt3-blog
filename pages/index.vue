<script setup lang="ts">
import { HeaderTabs } from "~/utils/types";

definePageMeta({
  middleware () {
    return navigateTo(useLocalePath()(HeaderTabs[0].url));
  }
});
</script>
