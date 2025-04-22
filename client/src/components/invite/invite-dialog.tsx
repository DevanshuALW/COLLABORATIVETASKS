import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['viewer', 'editor', 'admin']).default('editor'),
  message: z.string().optional(),
});

interface InviteEmail {
  email: string;
  role: 'viewer' | 'editor' | 'admin';
}

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: number;
  existingMembers: User[];
}

export function InviteDialog({ 
  open, 
  onOpenChange, 
  boardId,
  existingMembers
}: InviteDialogProps) {
  const [invites, setInvites] = useState<InviteEmail[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: 'editor',
      message: '',
    },
  });

  const sendInviteMutation = useMutation({
    mutationFn: async () => {
      // In a real app, this would send invites via email
      // For this prototype, we'll just pretend it worked
      
      toast({
        title: 'Invites sent',
        description: `Sent ${invites.length} invitation${invites.length !== 1 ? 's' : ''}.`,
      });
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/boards/${boardId}/members`] });
      setInvites([]);
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error sending invites:', error);
      toast({
        title: 'Failed to send invites',
        description: 'There was a problem sending the invitations. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const addInvite = () => {
    const { email, role } = form.getValues();
    
    // Validate form
    if (!form.formState.isValid) {
      form.trigger();
      return;
    }
    
    // Check if email already exists in invites
    if (invites.some(invite => invite.email === email)) {
      toast({
        title: 'Email already added',
        description: 'This email has already been added to the invite list.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if user is already a member
    if (existingMembers.some(member => member.username === email || member.phoneNumber === email)) {
      toast({
        title: 'Already a member',
        description: 'This user is already a member of the board.',
        variant: 'destructive',
      });
      return;
    }
    
    // Add to invites
    setInvites([...invites, { email, role: role as 'viewer' | 'editor' | 'admin' }]);
    
    // Reset email field
    form.setValue('email', '');
  };

  const removeInvite = (email: string) => {
    setInvites(invites.filter(invite => invite.email !== email));
  };

  const sendInvites = () => {
    if (invites.length === 0) {
      toast({
        title: 'No invites to send',
        description: 'Please add at least one email to send invites.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    sendInviteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg leading-6 font-medium">Invite Members</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <Input 
                        placeholder="Enter email address" 
                        {...field} 
                        className="rounded-r-none"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      onClick={addInvite}
                      className="rounded-l-none"
                    >
                      Add
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permission</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="viewer" id="role-viewer" />
                        <Label htmlFor="role-viewer">Viewer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="editor" id="role-editor" />
                        <Label htmlFor="role-editor">Editor</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="role-admin" />
                        <Label htmlFor="role-admin">Admin</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {invites.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Invites</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {invites.map(invite => (
                    <div 
                      key={invite.email} 
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                    >
                      <div className="flex items-center">
                        <span className="text-sm text-gray-800">{invite.email}</span>
                        <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded-full">
                          {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInvite(invite.email)}
                        className="text-gray-400 hover:text-gray-600 h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add a personalized message..." 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
        
        <DialogFooter className="mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={sendInvites}
            disabled={isSubmitting || invites.length === 0}
          >
            {isSubmitting ? 'Sending...' : 'Send Invites'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
