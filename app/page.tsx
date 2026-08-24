import { StoreProvider } from "@/lib/store";
import { MPCShell } from "@/components/MPCShell";

export default function Home() {
  return (
    <StoreProvider>
      <MPCShell />
    </StoreProvider>
  );
}
