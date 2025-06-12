import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Add bundle analyzer (only in analyze mode)
    ...(process.env.ANALYZE ? [visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })] : []),
  ],
  
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  
  base: './',
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
  
  build: {
    // Increase chunk size warning limit to 1MB for main chunks
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // PDF library - keep it as a separate chunk
          if (id.includes('@react-pdf/renderer')) {
            return 'pdf';
          }
          
          // Vendor libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react') || id.includes('react-hot-toast')) {
              return 'ui-vendor';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
            if (id.includes('@paypal/react-paypal-js')) {
              return 'paypal';
            }
            if (id.includes('date-fns') || id.includes('uuid')) {
              return 'utils';
            }
            return 'vendor';
          }
          
          // Feature-based chunks for your source code
          if (id.includes('/src/components/admin/')) {
            return 'admin';
          }
          if (id.includes('/src/components/subscription/')) {
            return 'subscription';
          }
          if (id.includes('/src/components/auth/') || 
              id.includes('AuthForm') || 
              id.includes('EmailVerification') || 
              id.includes('ForgotPassword') || 
              id.includes('ResetPassword') || 
              id.includes('SessionExpired') || 
              id.includes('InvitationAccept')) {
            return 'auth';
          }
          if (id.includes('/src/hooks/usePdfGeneration') || 
              id.includes('/src/components/TranscriptPDF') ||
              id.includes('/src/components/guardian/PDFPreviewModal')) {
            return 'pdf-components';
          }
        }
      }
    }
  }
});
