import { Component, Show } from 'solid-js';

interface ToastProps {
  message: string | null;
}

const Toast: Component<ToastProps> = (props) => {
  return (
    <Show when={props.message !== null}>
      <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
        <div class="bg-spy-danger text-white rounded-xl px-5 py-3 text-sm font-semibold shadow-xl">
          {props.message}
        </div>
      </div>
    </Show>
  );
};

export default Toast;
