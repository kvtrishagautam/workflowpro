import request from 'supertest';
import { app } from '../../src/server'; // Adjust the import based on your server setup
import { Workflow } from '../../src/models/workflow';

describe('Workflows API', () => {
  let workflowId: string;

  beforeAll(async () => {
    // Create a workflow for testing
    const response = await request(app)
      .post('/api/workflows')
      .send({ name: 'Test Workflow', nodes: [] });
    workflowId = response.body.id;
  });

  afterAll(async () => {
    // Clean up the created workflow
    await request(app).delete(`/api/workflows/${workflowId}`);
  });

  it('should create a workflow', async () => {
    const response = await request(app)
      .post('/api/workflows')
      .send({ name: 'New Workflow', nodes: [] });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('New Workflow');
  });

  it('should get a workflow by ID', async () => {
    const response = await request(app).get(`/api/workflows/${workflowId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', workflowId);
  });

  it('should update a workflow', async () => {
    const response = await request(app)
      .put(`/api/workflows/${workflowId}`)
      .send({ name: 'Updated Workflow' });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Workflow');
  });

  it('should delete a workflow', async () => {
    const response = await request(app).delete(`/api/workflows/${workflowId}`);
    
    expect(response.status).toBe(204);
  });
});