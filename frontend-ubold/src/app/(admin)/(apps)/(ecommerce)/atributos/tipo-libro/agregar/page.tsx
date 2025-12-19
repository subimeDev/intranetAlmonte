import { Container } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import AddTipoLibroForm from '../components/AddTipoLibroForm'

export default function Page() {
  return (
    <Container fluid>
      <PageBreadcrumb title="Agregar Tipo de Libro" subtitle="Ecommerce" />
      <AddTipoLibroForm />
    </Container>
  )
}

