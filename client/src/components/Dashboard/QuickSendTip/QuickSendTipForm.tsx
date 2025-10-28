'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AmountSelector } from './AmountSelector';
import { type SendTipFormData } from '@/lib/validations/tip';
import { useQuickSendForm } from '@/app/dashboard/hooks/useQuickSendForm';
import { useWalletState } from '@/store';
import { Loader2, Wallet } from 'lucide-react';

interface QuickSendTipFormProps {
  onSuccess?: (data: SendTipFormData) => void;
  onError?: (error: Error) => void;
}

export const QuickSendTipForm: React.FC<QuickSendTipFormProps> = ({
  onSuccess,
  onError,
}) => {
  const { isConnected } = useWalletState();
  const { form, handleSubmit, isLoading, error, isSuccess, successMessage } = useQuickSendForm({
    onSuccess,
    onError,
  });

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Quick-Send Tip
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Recipient Handle */}
          <FormField
            control={form.control}
            name="recipientHandle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Recipient Twitter Handle
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      @
                    </span>
                    <Input
                      placeholder="username"
                      {...field}
                      className="pl-8 h-12"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount Selection */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Amount
                </FormLabel>
                <FormControl>
                  <AmountSelector
                    value={field.value}
                    onChange={field.onChange}
                    error={form.formState.errors.amount?.message}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Optional Note */}
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Optional Note
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Say something nice..."
                    {...field}
                    className="min-h-[100px] resize-none"
                    disabled={isLoading}
                    maxLength={280}
                  />
                </FormControl>
                <div className="flex justify-between items-center">
                  <FormMessage />
                  <span className="text-xs text-gray-500">
                    {field.value?.length || 0}/280
                  </span>
                </div>
              </FormItem>
            )}
          />

          {/* Wallet Connection Warning */}
          {!isConnected && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center">
                <Wallet className="h-4 w-4 text-amber-600 mr-2" />
                <p className="text-sm text-amber-700">
                  Please connect your wallet to send tips
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/80 text-white font-medium"
            disabled={isLoading || !isConnected}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Tip...
              </>
            ) : !isConnected ? (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet to Send
              </>
            ) : (
              'Send Tip'
            )}
          </Button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                {error.message || 'Failed to send tip. Please try again.'}
              </p>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                {successMessage || 'Tip sent successfully! 🎉'}
              </p>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};
