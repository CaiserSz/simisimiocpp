import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Stations } from '../Stations';
import userEvent from '@testing-library/user-event';

// Mock API responses
const mockStations = [
  { 
    id: '1', 
    name: 'Test Station 1', 
    model: 'Test Model 1', 
    connector: 'CCS', 
    power: 50, 
    status: 'Available' 
  },
  { 
    id: '2', 
    name: 'Test Station 2', 
    model: 'Test Model 2', 
    connector: 'Type 2', 
    power: 22, 
    status: 'Charging' 
  }
];

// Setup mock server
const server = setupServer(
  rest.get('/api/stations', (req, res, ctx) => {
    return res(ctx.json(mockStations));
  }),
  
  rest.post('/api/stations', (req, res, ctx) => {
    const newStation = { ...req.body, id: '3' };
    return res(ctx.json(newStation), ctx.status(201));
  }),
  
  rest.put('/api/stations/:id', (req, res, ctx) => {
    const updatedStation = { ...req.body, id: req.params.id };
    return res(ctx.json(updatedStation));
  }),
  
  rest.delete('/api/stations/:id', (req, res, ctx) => {
    return res(ctx.status(204));
  }),
  
  rest.post('/api/stations/:id/start', (req, res, ctx) => {
    return res(ctx.json({ ...mockStations[0], status: 'Charging' }));
  }),
  
  rest.post('/api/stations/:id/stop', (req, res, ctx) => {
    return res(ctx.json({ ...mockStations[1], status: 'Available' }));
  })
);

// Enable API mocking before tests
beforeAll(() => server.listen());

// Reset any runtime request handlers we may add during the tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Test kullanıcısı oluştur
const user = userEvent.setup();

describe('Stations Component - Integration Tests', () => {
  test('renders loading state initially', () => {
    render(
      <MemoryRouter>
        <Stations />
      </MemoryRouter>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays stations after loading', async () => {
    render(
      <MemoryRouter>
        <Stations />
      </MemoryRouter>
    );
    
    // Wait for stations to load
    const station1 = await screen.findByText('Test Station 1');
    const station2 = await screen.findByText('Test Station 2');
    
    expect(station1).toBeInTheDocument();
    expect(station2).toBeInTheDocument();
    
    // Check status chips
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Charging')).toBeInTheDocument();
  });

  test('completes full station management flow', async () => {
    // 1. Render the component with router
    render(
      <MemoryRouter initialEntries={['/stations']}>
        <Routes>
          <Route path="/stations" element={<Stations />} />
        </Routes>
      </MemoryRouter>
    );

    // 2. Wait for initial data load
    const station1 = await screen.findByText('Test Station 1');
    expect(station1).toBeInTheDocument();

    // 3. Add a new station
    await user.click(screen.getByRole('button', { name: /yeni istasyon/i }));
    
    // 4. Fill out the form
    const dialog = screen.getByRole('dialog');
    
    await user.type(
      within(dialog).getByLabelText(/istasyon adı/i), 
      'New Integration Test Station'
    );
    
    await user.type(
      within(dialog).getByLabelText(/model/i), 
      'Integration Test Model'
    );
    
    // Select connector type
    await user.click(within(dialog).getByLabelText(/konnektör tipi/i));
    await user.click(screen.getByRole('option', { name: /type 2/i }));
    
    // Set power
    const powerInput = within(dialog).getByLabelText(/güç/i);
    await user.clear(powerInput);
    await user.type(powerInput, '22.5');
    
    // 5. Submit the form
    await user.click(within(dialog).getByRole('button', { name: /ekle/i }));
    
    // 6. Verify success message
    await waitFor(() => {
      expect(screen.getByText('İstasyon başarıyla eklendi')).toBeInTheDocument();
    });
    
    // 7. Verify the new station is in the list
    await waitFor(() => {
      expect(screen.getByText('New Integration Test Station')).toBeInTheDocument();
    });
    
    // 8. Edit the station
    const stationRow = screen.getByRole('row', { name: /New Integration Test Station/i });
    const editButton = within(stationRow).getByRole('button', { name: /düzenle/i });
    await user.click(editButton);
    
    // 9. Update the station name
    const editDialog = screen.getByRole('dialog');
    await user.clear(within(editDialog).getByLabelText(/istasyon adı/i));
    await user.type(
      within(editDialog).getByLabelText(/istasyon adı/i), 
      'Updated Integration Test Station'
    );
    
    // 10. Submit the update
    await user.click(within(editDialog).getByRole('button', { name: /güncelle/i }));
    
    // 11. Verify update success
    await waitFor(() => {
      expect(screen.getByText('İstasyon başarıyla güncellendi')).toBeInTheDocument();
    });
    
    // 12. Start charging
    const updatedRow = screen.getByRole('row', { name: /Updated Integration Test Station/i });
    const startButton = within(updatedRow).getByRole('button', { name: /şarjı başlat/i });
    await user.click(startButton);
    
    // 13. Verify charging started
    await waitFor(() => {
      expect(screen.getByText('Şarj başlatıldı.')).toBeInTheDocument();
    });
    
    // 14. Stop charging
    const updatedRowAfterEdit = screen.getByRole('row', { name: /Updated Integration Test Station/i });
    const stopButton = within(updatedRowAfterEdit).getByRole('button', { name: /şarjı durdur/i });
    await user.click(stopButton);
    
    // 15. Verify charging stopped
    await waitFor(() => {
      expect(screen.getByText('Şarj durduruldu.')).toBeInTheDocument();
    });
    
    // 16. Delete the station
    const updatedRowAfterStop = screen.getByRole('row', { name: /Updated Integration Test Station/i });
    const deleteButton = within(updatedRowAfterStop).getByRole('button', { name: /sil/i });
    await user.click(deleteButton);
    
    // 17. Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /ok/i });
    await user.click(confirmButton);
    
    // 18. Verify deletion
    await waitFor(() => {
      expect(screen.getByText('İstasyon başarıyla silindi.')).toBeInTheDocument();
    });
    
    // 19. Verify station is removed from the list
    await waitFor(() => {
      expect(screen.queryByText('Updated Integration Test Station')).not.toBeInTheDocument();
    });
  });

  test('starts charging for a station', async () => {
    render(
      <MemoryRouter>
        <Stations />
      </MemoryRouter>
    );
    
    // Wait for stations to load
    await screen.findByText('Test Station 1');
    
    // Find and click start charging button for the first station
    const startButtons = screen.getAllByLabelText('Şarjı Başlat');
    fireEvent.click(startButtons[0]);
    
    // Check if the success message appears
    await waitFor(() => {
      expect(screen.getByText('Şarj başlatıldı.')).toBeInTheDocument();
    });
  });

  test('deletes a station', async () => {
    render(
      <MemoryRouter>
        <Stations />
      </MemoryRouter>
    );
    
    // Wait for stations to load
    await screen.findByText('Test Station 1');
    
    // Find and click delete button for the first station
    const deleteButtons = screen.getAllByLabelText('Sil');
    fireEvent.click(deleteButtons[0]);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /ok/i });
    fireEvent.click(confirmButton);
    
    // Check if the success message appears
    await waitFor(() => {
      expect(screen.getByText('İstasyon başarıyla silindi.')).toBeInTheDocument();
    });
  });
});
