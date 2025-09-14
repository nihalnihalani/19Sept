import ModernAlchemyStudio from '@/components/ui/modern-app-component';
import { StudioProvider } from '@/lib/useStudio';

export default function Page() {
  return (
    <StudioProvider>
      <ModernAlchemyStudio />
    </StudioProvider>
  );
}
