import { Container } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import AddAutorForm from '../components/AddAutorForm'

export default function Page() {
  return (
    <Container fluid>
      <PageBreadcrumb title="Agregar Autor" subtitle="Ecommerce" />
      <AddAutorForm />
    </Container>
  )
}

