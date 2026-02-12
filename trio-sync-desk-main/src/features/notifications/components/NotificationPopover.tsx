import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom"; // Assuming react-router-dom

export function NotificationPopover() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold leading-none">Notificações</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto p-0 text-muted-foreground hover:text-primary"
                            onClick={() => markAllAsRead.mutate()}
                        >
                            Marcar todas como lidas
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications?.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Nenhuma notificação nova.
                        </div>
                    ) : (
                        <div className="grid">
                            {notifications?.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex flex-col gap-1 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                                        !notification.read && "bg-muted/20"
                                    )}
                                    onClick={() => {
                                        if (!notification.read) markAsRead.mutate(notification.id);
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium leading-none">
                                            {notification.title}
                                        </p>
                                        {!notification.read && (
                                            <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <span className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(notification.created_at), {
                                            addSuffix: true,
                                            locale: ptBR,
                                        })}
                                    </span>
                                    {notification.link && (
                                        <Link
                                            to={notification.link}
                                            className="absolute inset-0"
                                            onClick={() => {
                                                if (!notification.read) markAsRead.mutate(notification.id);
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
