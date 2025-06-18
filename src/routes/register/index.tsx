import { component$ } from "@builder.io/qwik";
import { getRegisterUserFunction } from "./register";
import { useNavigate } from "@builder.io/qwik-city";

export default component$(() => {
  const nav = useNavigate();
  return (
    <form onSubmit$={getRegisterUserFunction(nav)} preventdefault:submit>
      <label>
        Email:
        <input type="email" name="email" required />
      </label>
      <label>
        Password:
        <input type="password" name="password" required />
      </label>
      <label>
        Name:
        <input type="text" name="name" />
      </label>
      <button type="submit">Register</button>
    </form>
  );
});
