import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  color: z.enum(['primary', 'secondary', 'accent', 'warning', 'error']).default('primary'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBoardDialog({ open, onOpenChange }: CreateBoardDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      color: 'primary',
    },
  });

  const createBoardMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error('User not authenticated');
      
      const response = await apiRequest('POST', '/api/boards', {
        ...values,
        createdBy: user.id,
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards', user?.id] });
      toast({
        title: 'Board created',
        description: 'Your new board has been created successfully.',
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating board:', error);
      toast({
        title: 'Failed to create board',
        description: 'There was a problem creating your board. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    createBoardMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg leading-6 font-medium">Create New Board</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter board title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter board description (optional)" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="primary" id="color-primary" className="sr-only" />
                        <Label
                          htmlFor="color-primary"
                          className={`h-8 w-8 rounded-full bg-primary cursor-pointer border-2 ${
                            field.value === 'primary' ? 'border-white ring-2 ring-primary' : 'border-white'
                          }`}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="secondary" id="color-secondary" className="sr-only" />
                        <Label
                          htmlFor="color-secondary"
                          className={`h-8 w-8 rounded-full bg-secondary-500 cursor-pointer border-2 ${
                            field.value === 'secondary' ? 'border-white ring-2 ring-secondary-500' : 'border-white'
                          }`}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="accent" id="color-accent" className="sr-only" />
                        <Label
                          htmlFor="color-accent"
                          className={`h-8 w-8 rounded-full bg-accent-500 cursor-pointer border-2 ${
                            field.value === 'accent' ? 'border-white ring-2 ring-accent-500' : 'border-white'
                          }`}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="warning" id="color-warning" className="sr-only" />
                        <Label
                          htmlFor="color-warning"
                          className={`h-8 w-8 rounded-full bg-yellow-500 cursor-pointer border-2 ${
                            field.value === 'warning' ? 'border-white ring-2 ring-yellow-500' : 'border-white'
                          }`}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="error" id="color-error" className="sr-only" />
                        <Label
                          htmlFor="color-error"
                          className={`h-8 w-8 rounded-full bg-destructive cursor-pointer border-2 ${
                            field.value === 'error' ? 'border-white ring-2 ring-destructive' : 'border-white'
                          }`}
                        />
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
