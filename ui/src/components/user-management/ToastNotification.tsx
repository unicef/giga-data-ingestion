import type { Dispatch, SetStateAction } from "react";

import {
  ToastNotification as CarbonToastNotification,
  type ToastNotificationProps,
} from "@carbon/react";

type ToastProps = {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>> | ((bool: boolean) => void);
  kind?: ToastNotificationProps["kind"];
  caption: string;
  title: string;
};

function ToastNotification({ show, setShow, kind, caption, title }: ToastProps) {
  return (
    show && (
      <CarbonToastNotification
        aria-label={`${title} notification`}
        kind={kind}
        caption={caption}
        onClose={() => setShow(false)}
        onCloseButtonClick={() => setShow(false)}
        statusIconDescription={kind}
        timeout={5000}
        title={title}
        className="absolute top-0 right-0 z-50 mx-6 my-16"
      />
    )
  );
}

export default ToastNotification;
