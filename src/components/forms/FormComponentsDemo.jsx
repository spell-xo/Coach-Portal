import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Divider,
  Grid,
} from '@mui/material';
import {
  FormField,
  RichTextEditor,
  FileUploadField,
  ImageCropField,
  AutoSaveForm,
  clearFormDraft,
} from './index';
import { showToast } from '../../utils/toast';
import SendIcon from '@mui/icons-material/Send';

/**
 * Demo form showcasing all enhanced form components
 *
 * This component demonstrates:
 * - FormField with validation
 * - RichTextEditor
 * - FileUploadField
 * - ImageCropField
 * - AutoSaveForm with draft saving
 */
const FormComponentsDemo = () => {
  const STORAGE_KEY = 'demo-form-draft';

  const validationSchema = Yup.object({
    title: Yup.string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be less than 100 characters')
      .required('Title is required'),
    description: Yup.string()
      .min(10, 'Description must be at least 10 characters')
      .required('Description is required'),
    message: Yup.string()
      .required('Message content is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    attachments: Yup.mixed()
      .test('fileSize', 'File is too large', (value) => {
        if (!value) return true;
        const files = Array.isArray(value) ? value : [value];
        return files.every(file => file.size <= 10485760); // 10MB
      }),
    avatar: Yup.mixed(),
  });

  const initialValues = {
    title: '',
    description: '',
    message: '',
    email: '',
    attachments: null,
    avatar: null,
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Form submitted:', values);
      showToast.success('Form submitted successfully!');

      // Clear the saved draft
      clearFormDraft(STORAGE_KEY);

      // Reset form
      resetForm();
    } catch (error) {
      showToast.error('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async (values) => {
    // This could make an API call to save to the backend
    console.log('Draft saved:', values);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Enhanced Form Components Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This form showcases all the enhanced form components with automatic draft
          saving, inline validation, and rich interactions.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, isValid, dirty }) => (
            <Form>
              <AutoSaveForm
                storageKey={STORAGE_KEY}
                debounceMs={1000}
                onSave={handleSaveDraft}
                enabled={true}
                showIndicator={true}
                indicatorPosition="top-right"
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Basic Text Fields */}
                  <Typography variant="h6" sx={{ fontWeight: 600, mt: 2 }}>
                    Basic Information
                  </Typography>

                  <FormField
                    name="title"
                    label="Title"
                    placeholder="Enter a title..."
                    required
                    helperText="A short, descriptive title"
                  />

                  <FormField
                    name="email"
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    required
                    helperText="We'll never share your email"
                  />

                  <FormField
                    name="description"
                    label="Description"
                    placeholder="Enter a brief description..."
                    multiline
                    rows={3}
                    required
                    helperText="Provide a short description (10-500 characters)"
                  />

                  <Divider />

                  {/* Rich Text Editor */}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Message Content
                  </Typography>

                  <RichTextEditor
                    name="message"
                    label="Message"
                    placeholder="Write your message here..."
                    required
                    maxLength={1000}
                    minHeight={200}
                    helperText="Use the toolbar to format your message"
                  />

                  <Divider />

                  {/* File Upload */}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Attachments
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FileUploadField
                        name="attachments"
                        label="File Attachments"
                        accept={{
                          'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                          'application/pdf': ['.pdf'],
                        }}
                        maxSize={10485760} // 10MB
                        maxFiles={3}
                        showPreview={true}
                        helperText="Upload up to 3 files (images or PDFs)"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <ImageCropField
                        name="avatar"
                        label="Profile Image"
                        helperText="Upload and crop your profile image"
                        aspectRatio={1}
                        circularCrop={true}
                        maxSize={5242880} // 5MB
                        outputFormat="base64"
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ mt: 2 }} />

                  {/* Submit Button */}
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => {
                        clearFormDraft(STORAGE_KEY);
                        showToast.info('Draft cleared');
                      }}
                      disabled={isSubmitting}
                    >
                      Clear Draft
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting || !isValid}
                      startIcon={<SendIcon />}
                      sx={{ minWidth: 150 }}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Form'}
                    </Button>
                  </Box>

                  {/* Form Status */}
                  {!isValid && dirty && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ textAlign: 'center', mt: 1 }}
                    >
                      Please fix validation errors before submitting
                    </Typography>
                  )}
                </Box>
              </AutoSaveForm>
            </Form>
          )}
        </Formik>
      </Paper>

      {/* Usage Instructions */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Features Demonstrated
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Real-time Validation:</strong> See validation feedback as you type
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Auto-save Drafts:</strong> Your form data is saved automatically
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Rich Text Editing:</strong> Format text with the toolbar
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Drag & Drop Upload:</strong> Drag files onto the upload area
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Image Cropping:</strong> Upload and crop profile images
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Success Indicators:</strong> Green checkmarks appear for valid fields
            </Typography>
          </li>
        </Box>
      </Paper>
    </Container>
  );
};

export default FormComponentsDemo;
