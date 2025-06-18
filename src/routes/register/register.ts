import { $, QRLEventHandlerMulti } from "@builder.io/qwik";
import { RouteNavigate, z } from "@builder.io/qwik-city";
import { getUserClient, UserAccount, UserID } from "~/lib/appwrite";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  name: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : val))
    .optional(),
});
type RegisterSchema = z.infer<typeof registerSchema>;
export function getRegisterUserFunction(nav: RouteNavigate): QRLEventHandlerMulti<SubmitEvent, HTMLFormElement> {
  return $(
    async (event) => {
      // validate the form data
      const formData = new FormData(event.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());
      const parsedData = registerSchema.safeParse(data);
      if (!parsedData.success) {
        console.error("Validation failed:", parsedData.error);
        return;
      }
      const userClient = await getUserClient();
      const account = new UserAccount(userClient);
      try {
        const response = await account.create(
          UserID.unique(),
          parsedData.data.email,
          parsedData.data.password,
          parsedData.data.name
        );
        // login automatically after registration
        await account.createEmailPasswordSession(
          parsedData.data.email,
          parsedData.data.password
        );
        console.log("Registration successful:", response);
        alert("Registration successful! You are now logged in.");
        // Optionally redirect or update UI after successful registration
        nav("/app");
      } catch (error) {
        alert("Registration failed: " + (error as Error).message);
        console.error("Registration error:", error);
        return;
      }
    }
  );
}