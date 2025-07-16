import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import SocketProvider from "@/components/socket-provider";
import ActionButtons from "@/components/action-buttons";

export default function TorrentsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <SidebarProvider>
                <AppSidebar />
                <SocketProvider />
                <main className="w-full p-4">
                    <ActionButtons />
                    {children}
                </main>
            </SidebarProvider>
        </>
    );
}
