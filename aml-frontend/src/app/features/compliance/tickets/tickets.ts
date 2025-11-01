import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceService, Ticket, TicketResponse } from '../../../core/services/compliance.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.html',
  styleUrls: ['./tickets.css']
})
export class Tickets implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Filters
  filterStatus: string = 'all';
  filterPriority: string = 'all';
  searchQuery = '';

  // Ticket Detail Modal
  showTicketModal = false;
  selectedTicket: Ticket | null = null;
  ticketResponses: TicketResponse[] = [];
  loadingResponses = false;
  responseMessage = '';

  // Status update
  updatingStatus = false;
  updatingPriority = false;

  constructor(private complianceService: ComplianceService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.complianceService.getMyTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        
        // Check if it's a 500 error (backend not implemented)
        if (error.status === 500) {
          this.errorMessage = 'Ticket system is not yet configured in the backend. Please contact your administrator.';
        } else if (error.status === 404) {
          this.errorMessage = 'Ticket endpoint not found. The backend may need to be updated.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to load tickets. Please try again later.';
        }
        
        this.isLoading = false;
        this.tickets = [];
        this.filteredTickets = [];
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.tickets];

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === this.filterStatus);
    }

    // Filter by priority
    if (this.filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === this.filterPriority);
    }

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.subject.toLowerCase().includes(query) ||
        t.customerName.toLowerCase().includes(query) ||
        t.ticketId.toString().includes(query)
      );
    }

    this.filteredTickets = filtered;
  }

  openTicketDetails(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.showTicketModal = true;
    this.responseMessage = '';
    this.loadingResponses = false;
    // Note: Backend doesn't have responses endpoint yet
    this.ticketResponses = [];
  }

  closeTicketModal(): void {
    this.showTicketModal = false;
    this.selectedTicket = null;
    this.ticketResponses = [];
    this.responseMessage = '';
  }

  submitResponse(): void {
    this.errorMessage = 'Response feature will be available once backend implements the endpoint';
    setTimeout(() => this.errorMessage = '', 3000);
  }

  updateStatus(newStatus: string): void {
    this.errorMessage = 'Status update feature will be available once backend implements the endpoint';
    setTimeout(() => this.errorMessage = '', 3000);
  }

  updatePriority(newPriority: string): void {
    this.errorMessage = 'Priority update feature will be available once backend implements the endpoint';
    setTimeout(() => this.errorMessage = '', 3000);
  }

  resolveTicket(): void {
    if (!this.selectedTicket || !this.responseMessage.trim()) {
      this.errorMessage = 'Please provide a resolution message';
      return;
    }

    if (confirm('Mark this ticket as resolved?')) {
      this.complianceService.resolveTicket(this.selectedTicket.ticketId, this.responseMessage).subscribe({
        next: (updatedTicket) => {
          this.successMessage = 'Ticket resolved successfully';
          this.selectedTicket = updatedTicket;
          this.loadTickets();
          this.closeTicketModal();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error resolving ticket:', error);
          this.errorMessage = 'Failed to resolve ticket';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'OPEN': 'status-open',
      'IN_PROGRESS': 'status-in-progress',
      'RESOLVED': 'status-resolved',
      'CLOSED': 'status-closed'
    };
    return statusMap[status] || 'status-open';
  }

  getPriorityClass(priority: string): string {
    const priorityMap: any = {
      'LOW': 'priority-low',
      'MEDIUM': 'priority-medium',
      'HIGH': 'priority-high',
      'URGENT': 'priority-urgent'
    };
    return priorityMap[priority] || 'priority-medium';
  }

  getTicketCount(status: string): number {
    if (status === 'all') return this.tickets.length;
    return this.tickets.filter(t => t.status === status).length;
  }
}
