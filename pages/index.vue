<script setup lang="ts">
import { HeaderTabs } from "~/utils/common";

definePageMeta({
  middleware () {
    return navigateTo(useLocalePath()(HeaderTabs[0].url));
  }
});
</script>
