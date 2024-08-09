import { translate } from "~/utils/nuxt";

export default function Visitors (props: { visitors: number }) {
  return (
    __NB_MONGODB_ENABLED__ && Number(props.visitors) >= 0
      ? <span class="visitors flex" title={translate("visit-time", [props.visitors])}>
        <svg-icon name="view" />
        { props.visitors }
      </span>
      : null
  );
}
